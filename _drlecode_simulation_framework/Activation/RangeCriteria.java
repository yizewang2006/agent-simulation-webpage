package Activation;

public class RangeCriteria extends Activation_criteria
{
	//For numeric property
	public double activation_lowerRange = 0;

	public double activation_upperRange = 0;
	
	public RangeCriteria()
	{
		
	}
	
	public RangeCriteria(double low_r, double up_r)
	{
		this.activation_lowerRange = low_r;
		this.activation_upperRange = up_r;
	}
	
	
}
