package fitnessFuntcion;

public class fitness_score_list 
{
	//public double sumFitness = 0;
	public double fitnessMetric = 0;
	public double snakeShape_fitnessScore = 0;
	public double obstacleAvoidance_fitnessScore = 0;
	public double personalSpace_fitnessScore = 0;
	public double speedMetric_fitnessScore = 0;
	public double CircleShapeMetric_fitnessScore = 0;
	public double insideDestinationZone_fitnessScore = 0;
	public double collision_fitnessScore = 0;
	public double finish_time_fitnessScore = 0;
	public double follow_leader_fitnessScore = 0;
	public double exceed_AngleTurn_fitnessScore = 0;
	public double surround_leader_fitnessScore = 0;
	public int sucess_crossover = 0;
	public int sucess_mutation = 0;
	
	public fitness_score_list(double sum, double snake, double obs, double personal, double speed, double circle, double inside_zone, double collision, double finish, double follow_l, double exceed_a, double surround_l, int success_c, int success_m)
	{
		this.fitnessMetric = sum;
		this.snakeShape_fitnessScore = snake;
		this.obstacleAvoidance_fitnessScore = obs;
		this.personalSpace_fitnessScore = personal;
		this.speedMetric_fitnessScore = speed;
		this.CircleShapeMetric_fitnessScore = circle;
		this.insideDestinationZone_fitnessScore = inside_zone;
		this.collision_fitnessScore = collision;
		this.finish_time_fitnessScore = finish;
		this.follow_leader_fitnessScore = follow_l;
		this.exceed_AngleTurn_fitnessScore = exceed_a;
		this.surround_leader_fitnessScore = surround_l;
		this.sucess_crossover = success_c;
		this.sucess_mutation = success_m;
	}
}
